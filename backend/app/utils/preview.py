import os
import io
import mimetypes
from typing import Any, Union
from pathlib import Path

from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from PIL import Image

async def generate_preview(file_path: str, mime_type: str) -> Any:
    """Generate a preview for a document based on its mime type."""
    # For images, return the image directly or a resized version
    if mime_type.startswith('image/'):
        try:
            # Open the image and resize it if it's too large
            with Image.open(file_path) as img:
                # If image is very large, resize it for preview
                if img.width > 1200 or img.height > 1200:
                    img.thumbnail((1200, 1200))
                    
                    # Save to a buffer
                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format=img.format or 'JPEG')
                    img_byte_arr.seek(0)
                    
                    return StreamingResponse(
                        content=img_byte_arr,
                        media_type=mime_type
                    )
                
                # For smaller images, return the original
                return FileResponse(
                    path=file_path,
                    media_type=mime_type
                )
        except Exception as e:
            # If image processing fails, return the original
            return FileResponse(
                path=file_path,
                media_type=mime_type
            )
    
    # For PDFs, return the PDF directly (browsers can display PDFs)
    elif mime_type == 'application/pdf':
        return FileResponse(
            path=file_path,
            media_type=mime_type
        )
    
    # For text files, return the content with syntax highlighting
    elif mime_type.startswith('text/') or mime_type == 'application/json':
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Simple HTML wrapper with basic styling
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Text Preview</title>
                <style>
                    body {{ font-family: monospace; padding: 20px; line-height: 1.5; }}
                    pre {{ white-space: pre-wrap; word-wrap: break-word; }}
                </style>
            </head>
            <body>
                <pre>{content}</pre>
            </body>
            </html>
            """
            
            return HTMLResponse(content=html_content)
        except UnicodeDecodeError:
            # If the file is not valid text, return a message
            return HTMLResponse(
                content="<p>This text file contains binary data and cannot be previewed.</p>",
                status_code=400
            )
    
    # For other file types, return a message that preview is not available
    else:
        return HTMLResponse(
            content="<p>Preview not available for this file type.</p>",
            status_code=400
        )
