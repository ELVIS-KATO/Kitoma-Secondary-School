from typing import TypeVar, Generic, Sequence, List
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")

class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

async def paginate(
    session: AsyncSession,
    query,
    page: int = 1,
    size: int = 20
) -> dict:
    if page < 1:
        page = 1
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.scalar(count_query)
    
    # Apply limit/offset
    offset = (page - 1) * size
    query = query.offset(offset).limit(size)
    
    result = await session.execute(query)
    items = result.scalars().all()
    
    pages = (total + size - 1) // size if total > 0 else 0
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }
