"""Open Food Facts API proxy endpoints."""
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

            # Extract macros (Open Food Facts stores per 100g)
            # Convert to float first to handle decimal strings, then to int
            calories = int(float(nutriments.get("energy-kcal_100g", 0) or 0))
            protein = int(float(nutriments.get("proteins_100g", 0) or 0))
            carbs = int(float(nutriments.get("carbohydrates_100g", 0) or 0))
            fat = int(float(nutriments.get("fat_100g", 0) or 0))

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
                    "fields": "code,product_name,brands,serving_size,nutriments,image_url",
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

                # Extract macros (per 100g)
                # Convert to float first to handle decimal strings, then to int
                calories = int(float(nutriments.get("energy-kcal_100g", 0) or 0))
                protein = int(float(nutriments.get("proteins_100g", 0) or 0))
                carbs = int(float(nutriments.get("carbohydrates_100g", 0) or 0))
                fat = int(float(nutriments.get("fat_100g", 0) or 0))

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
