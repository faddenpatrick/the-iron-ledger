"""Open Food Facts API proxy endpoints."""
import re
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import httpx
from pydantic import BaseModel


router = APIRouter()

OPEN_FOOD_FACTS_BASE = "https://world.openfoodfacts.org"


class OpenFoodFactsProduct(BaseModel):
    """Simplified Open Food Facts product response."""
    barcode: str
    name: str
    brands: Optional[str] = None
    serving_size: Optional[str] = None
    calories: int
    protein: int
    carbs: int
    fat: int
    image_url: Optional[str] = None


# Conversion factors to grams for common weight units
_UNIT_TO_GRAMS = {
    "g": 1.0,
    "mg": 0.001,
    "kg": 1000.0,
    "oz": 28.3495,
    "lb": 453.592,
    "ml": 1.0,  # approximate (density ≈ 1 for most beverages)
    "cl": 10.0,
    "dl": 100.0,
    "l": 1000.0,
}


def _parse_serving_grams(serving_size: str) -> Optional[float]:
    """Try to extract grams from a serving_size string like '28g', '1 oz', '250 ml'."""
    if not serving_size:
        return None
    # Match patterns like "28g", "1.5 oz", "250ml", "100 g"
    match = re.search(r"(\d+(?:[.,]\d+)?)\s*(g|mg|kg|oz|lb|ml|cl|dl|l)\b", serving_size.lower())
    if not match:
        return None
    amount = float(match.group(1).replace(",", "."))
    unit = match.group(2)
    factor = _UNIT_TO_GRAMS.get(unit)
    if factor is None or amount <= 0:
        return None
    return amount * factor


def _scale_to_serving(per_100g: float, serving_grams: Optional[float]) -> int:
    """Scale a per-100g value to per-serving. Falls back to per-100g if parsing fails."""
    if serving_grams is None or serving_grams <= 0:
        return int(per_100g)
    return int(round(per_100g * serving_grams / 100.0))


@router.get("/barcode/{barcode}")
async def get_product_by_barcode(barcode: str):
    """
    Get product information by barcode from Open Food Facts.

    Returns nutrition information for a product.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{OPEN_FOOD_FACTS_BASE}/api/v2/product/{barcode}.json")
            response.raise_for_status()
            data = response.json()

            if data.get("status") != 1:
                raise HTTPException(status_code=404, detail="Product not found")

            product = data.get("product", {})

            # Extract nutrition data (per 100g by default)
            nutriments = product.get("nutriments", {})

            # Get serving size or default to 100g
            serving_size = product.get("serving_size", "100g")
            if not serving_size:
                serving_size = "100g"

            # Extract per-100g macros, then convert to per-serving
            cal_100g = float(nutriments.get("energy-kcal_100g", 0) or 0)
            pro_100g = float(nutriments.get("proteins_100g", 0) or 0)
            carb_100g = float(nutriments.get("carbohydrates_100g", 0) or 0)
            fat_100g = float(nutriments.get("fat_100g", 0) or 0)

            # Use serving_quantity (grams) from OFF if available, otherwise parse serving_size string
            serving_grams = None
            sq = product.get("serving_quantity")
            if sq:
                try:
                    serving_grams = float(sq)
                except (ValueError, TypeError):
                    pass
            if serving_grams is None:
                serving_grams = _parse_serving_grams(serving_size)

            calories = _scale_to_serving(cal_100g, serving_grams)
            protein = _scale_to_serving(pro_100g, serving_grams)
            carbs = _scale_to_serving(carb_100g, serving_grams)
            fat = _scale_to_serving(fat_100g, serving_grams)

            # Build product name
            name = product.get("product_name", "Unknown Product")
            brands = product.get("brands", "")
            if brands:
                name = f"{brands} - {name}"

            return {
                "barcode": barcode,
                "name": name,
                "brands": brands,
                "serving_size": serving_size,
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fat": fat,
                "image_url": product.get("image_url"),
            }

        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Failed to fetch from Open Food Facts: {str(e)}")


@router.get("/search")
async def search_products(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, le=100),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Search for products on Open Food Facts.

    Returns a list of products matching the search query.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{OPEN_FOOD_FACTS_BASE}/cgi/search.pl",
                params={
                    "search_terms": q,
                    "page": page,
                    "page_size": page_size,
                    "json": 1,
                    "fields": "code,product_name,brands,serving_size,serving_quantity,nutriments,image_url",
                }
            )
            response.raise_for_status()
            data = response.json()

            products = []
            for product in data.get("products", []):
                nutriments = product.get("nutriments", {})

                # Get serving size or default to 100g
                serving_size = product.get("serving_size", "100g")
                if not serving_size:
                    serving_size = "100g"

                # Extract per-100g macros, then convert to per-serving
                cal_100g = float(nutriments.get("energy-kcal_100g", 0) or 0)
                pro_100g = float(nutriments.get("proteins_100g", 0) or 0)
                carb_100g = float(nutriments.get("carbohydrates_100g", 0) or 0)
                fat_100g = float(nutriments.get("fat_100g", 0) or 0)

                # Use serving_quantity (grams) from OFF if available, otherwise parse
                serving_grams = None
                sq = product.get("serving_quantity")
                if sq:
                    try:
                        serving_grams = float(sq)
                    except (ValueError, TypeError):
                        pass
                if serving_grams is None:
                    serving_grams = _parse_serving_grams(serving_size)

                calories = _scale_to_serving(cal_100g, serving_grams)
                protein = _scale_to_serving(pro_100g, serving_grams)
                carbs = _scale_to_serving(carb_100g, serving_grams)
                fat = _scale_to_serving(fat_100g, serving_grams)

                # Build product name
                name = product.get("product_name", "Unknown Product")
                brands = product.get("brands", "")
                if brands:
                    name = f"{brands} - {name}"

                products.append({
                    "barcode": product.get("code", ""),
                    "name": name,
                    "brands": brands,
                    "serving_size": serving_size,
                    "calories": calories,
                    "protein": protein,
                    "carbs": carbs,
                    "fat": fat,
                    "image_url": product.get("image_url"),
                })

            return {
                "products": products,
                "page": page,
                "page_size": page_size,
                "total": data.get("count", 0),
            }

        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Failed to search Open Food Facts: {str(e)}")
