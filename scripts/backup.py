import os
import zipfile
import datetime

source_dir = r"c:\Users\Andris PC\Pictures\genspark\webapp"
parent_dir = r"c:\Users\Andris PC\Pictures\genspark"
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
backup_path = os.path.join(parent_dir, f"webapp_backup_{timestamp}.zip")

with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'dist', '.wrangler', 'tmp', '.opencode')]
        for file in files:
            file_path = os.path.join(root, file)
            zipf.write(file_path, os.path.relpath(file_path, source_dir))

print(f"Backup berhasil dibuat di:\n{backup_path}")
