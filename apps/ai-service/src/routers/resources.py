from fastapi import APIRouter, Body, HTTPException, status, Depends
from fastapi.encoders import jsonable_encoder
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..database import get_database
from ..models.resource import ResourceModel, UpdateResourceModel
from bson import ObjectId

router = APIRouter()

@router.post("/", response_description="Add new resource", response_model=ResourceModel)
async def create_resource(resource: ResourceModel = Body(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    resource_dict = resource.model_dump(by_alias=True, exclude=["id"])
    new_resource = await db["resources"].insert_one(resource_dict)
    created_resource = await db["resources"].find_one({"_id": new_resource.inserted_id})
    # Convert _id to string for response
    if created_resource:
        created_resource["_id"] = str(created_resource["_id"])
    return created_resource

@router.get("/", response_description="List all resources", response_model=List[ResourceModel])
async def list_resources(limit: int = 100, db: AsyncIOMotorDatabase = Depends(get_database)):
    resources = await db["resources"].find().to_list(limit)
    # Convert _id to string
    for r in resources:
        r["_id"] = str(r["_id"])
    return resources

@router.get("/{id}", response_description="Get a single resource", response_model=ResourceModel)
async def show_resource(id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    if (resource := await db["resources"].find_one({"_id": ObjectId(id)})) is not None:
        resource["_id"] = str(resource["_id"])
        return resource
    raise HTTPException(status_code=404, detail=f"Resource {id} not found")

@router.put("/{id}", response_description="Update a resource", response_model=ResourceModel)
async def update_resource(id: str, resource: UpdateResourceModel = Body(...), db: AsyncIOMotorDatabase = Depends(get_database)):
    resource_dict = {k: v for k, v in resource.model_dump().items() if v is not None}

    if len(resource_dict) >= 1:
        update_result = await db["resources"].update_one({"_id": ObjectId(id)}, {"$set": resource_dict})

        if update_result.modified_count == 1:
            if (updated_resource := await db["resources"].find_one({"_id": ObjectId(id)})) is not None:
                updated_resource["_id"] = str(updated_resource["_id"])
                return updated_resource

    if (existing_resource := await db["resources"].find_one({"_id": ObjectId(id)})) is not None:
        existing_resource["_id"] = str(existing_resource["_id"])
        return existing_resource

    raise HTTPException(status_code=404, detail=f"Resource {id} not found")

@router.delete("/{id}", response_description="Delete a resource")
async def delete_resource(id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    delete_result = await db["resources"].delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return {"message": f"Resource {id} deleted"}

    raise HTTPException(status_code=404, detail=f"Resource {id} not found")
