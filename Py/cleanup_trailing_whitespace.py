from pathlib import Path

ROOT = Path(r"D:\QSTools\qstools-web\components\employee-overheads")

ALLOWED = {".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".mdx"}

def clean_file(path: Path):
    try:
        text = path.read_text(encoding="utf-8")
    except:
        return False

    lines = text.splitlines()
    cleaned = [line.rstrip() for line in lines]

    if lines != cleaned:
        path.write_text("\n".join(cleaned) + "\n", encoding="utf-8")
        print(f"Cleaned: {path}")
        return True

    return False


def main():
    count = 0
    for file in ROOT.rglob("*"):
        if file.suffix in ALLOWED:
            if clean_file(file):
                count += 1

    print(f"\nFiles cleaned: {count}")


if __name__ == "__main__":
    main()