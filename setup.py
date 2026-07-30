import subprocess
from datetime import datetime
from pathlib import Path


EXTENSIONS = {".tsx", ".ts", ".json", ".html"}
IGNORE_DIRS = {
    "node_modules",
    ".git",
    "build",
}


def success(message: str) -> None:
    print(f"\033[92m{message}\033[0m")


def info(message: str) -> None:
    print(f"\033[96m{message}\033[0m")


def warn(message: str) -> None:
    print(f"\033[93m{message}\033[0m")


def prompt(label: str, transform=None) -> str:
    value = ""
    while not value:
        value = input(label).strip()
        if transform:
            value = transform(value)
    return value


def iter_target_files(root: Path) -> list:
    files = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if any(part in IGNORE_DIRS for part in path.parts):
            continue
        if path.suffix not in EXTENSIONS:
            continue
        files.append(path)
    return files


def replace_in_file(path: Path, replacements: list) -> bool:
    original = path.read_text(encoding="utf-8")

    updated = original
    for cur, sub in replacements:
        updated = updated.replace(cur, sub)

    if updated == original:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


def replace_strings(files: list, replacements: list) -> None:
    changed = 0
    for file in files:
        if replace_in_file(file, replacements):
            changed += 1
    success(f"Autoreplaced strings in {changed} file(s)!")


def replace_mongo_srv(mongo_srv: str) -> None:
    if not mongo_srv:
        return

    env_path = Path(".env")
    line = f"MONGO_SRV={mongo_srv}"

    if env_path.exists():
        content = env_path.read_text(encoding="utf-8")
        if "MONGO_SRV=" in content:
            return
        prefix = "" if (not content or content.endswith("\n")) else "\n"
        env_path.write_text(content + prefix + line, encoding="utf-8")
    else:
        env_path.write_text(line, encoding="utf-8")


def npm_install() -> None:
    info("Installing npm dependencies...")
    subprocess.run(["npm", "install"], check=True)
    subprocess.run(["npm", "install"], cwd="client", check=True)
    subprocess.run(
        ["npm", "install", "@adamjanicki/ui@latest"],
        cwd="client",
        stdout=subprocess.DEVNULL,
        check=True,
    )
    success("Installed npm dependencies!")


def cleanup() -> None:
    tutorial_images = Path("tutorial_images")
    if tutorial_images.exists():
        subprocess.run(["rm", "-rf", "tutorial_images"], check=True)


def self_delete(script_path: Path) -> None:
    script_path.unlink()
    success("Finished setting up!")


def main() -> None:
    root = Path(".").resolve()
    script_path = Path(__file__).resolve()

    repo_name = prompt(
        "What is the name of your repository?\n(e.g. my-app)\n>>> ",
        transform=lambda s: s.replace(" ", "-").lower(),
    )

    project_name = prompt("What is the name of your project?\n(e.g. My App)\n>>> ")

    description = prompt("What is a description of your project?\n>>> ")

    mongo_srv = input(
        "What is your mongo connection URL?\n"
        "(e.g. mongodb+srv://user:pass@cluster.abc123.mongodb.net/?retryWrites=true&w=majority)\n"
        ">>> "
    ).strip()

    replace_mongo_srv(mongo_srv)

    replacements = [
        (
            "Site built from Vercel MERN Skeleton",
            description,
        ),
        ("vercel-mern-skeleton", repo_name),
        ("Vercel MERN Skeleton", project_name),
        ("2022", f"{datetime.now().year}"),
    ]

    info(f"Setting up {project_name}...")

    files = iter_target_files(root)
    replace_strings(files, replacements)

    npm_install()

    info("Cleaning up...")
    cleanup()
    self_delete(script_path)

    info("Run `npm run dev` to start the development server")


if __name__ == "__main__":
    main()
