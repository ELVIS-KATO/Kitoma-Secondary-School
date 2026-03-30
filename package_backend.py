import PyInstaller.__main__
import os
import sys

# Define the root directory of the project
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, 'backend')

# Add the root directory to sys.path to allow imports
sys.path.append(backend_dir)

# Define PyInstaller arguments
args = [
    'backend/app/main.py',           # Entry point
    '--onefile',                     # Create a single executable
    '--name=backend',                # Name of the executable
    '--distpath=dist',               # Output directory for the executable
    '--workpath=build',              # Working directory for PyInstaller
    '--clean',                       # Clean cache before building
    '--hidden-import=aiosqlite',     # Explicitly include aiosqlite for SQLite support
    '--hidden-import=aiomysql',      # Explicitly include aiomysql
    '--hidden-import=uvicorn.logging',
    '--hidden-import=uvicorn.loops',
    '--hidden-import=uvicorn.loops.auto',
    '--hidden-import=uvicorn.protocols',
    '--hidden-import=uvicorn.protocols.http',
    '--hidden-import=uvicorn.protocols.http.auto',
    '--hidden-import=uvicorn.protocols.websockets',
    '--hidden-import=uvicorn.protocols.websockets.auto',
    '--hidden-import=uvicorn.lifespan',
    '--hidden-import=uvicorn.lifespan.on',
    '--hidden-import=reportlab.graphics.barcode.common',
    '--hidden-import=reportlab.graphics.barcode.code128',
    '--hidden-import=reportlab.graphics.barcode.code39',
    '--hidden-import=reportlab.graphics.barcode.usps',
]

# Run PyInstaller
PyInstaller.__main__.run(args)
