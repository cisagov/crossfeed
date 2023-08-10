import typer
import cities
import counties

app = typer.Typer()


@app.command()
def process_cities():
    cities.pull_cities()


@app.command()
def process_counties():
    counties.pull_counties()


@app.command()
def process_both():
    counties.pull_counties()
    cities.pull_cities()


if __name__ == "__main__":
    app()
