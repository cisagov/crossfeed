import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
import re


def pull_counties():
    print("Processing Counties...")
    # get the response in the form of html
    wikiurl = "https://en.wikipedia.org/wiki/List_of_United_States_counties_and_county_equivalents"
    table_class = "wikitable sortable jquery-tablesorter"
    response = requests.get(wikiurl)

    # parse data from the html into a beautifulsoup object
    soup = BeautifulSoup(response.text, "html.parser")
    countytable = soup.find("table", {"class": "wikitable"})

    links = countytable.select("a")

    holding_pen = []

    for link in links:
        try:
            county_pieces = link.get("title").split(", ")
            # OPEN WIKIPEDIA PAGE UP
            x = requests.get("https://en.wikipedia.org/" + link.get("href"))

            # PULL WEBSITE FROM WIKIPEDIA PAGE
            w = re.findall(
                r"<th scope=\"row\" class=\"infobox-label\">Website</th>.+</a>", x.text
            )
            # PULL URL OUT OF FOUND TEXT
            url = re.search(r"href=\"(.+?)\"", w[0])
            url = url.group()
            url = url.replace("href=", "")

            holding_pen.append(
                {
                    "County": county_pieces[0],
                    "State": county_pieces[1],
                    "URL": url,
                }
            )
        except Exception as e:
            pass

        time.sleep(1)

    df = pd.DataFrame(holding_pen, columns=["County", "State", "URL"])

    df.drop_duplicates(inplace=True)

    # Drop the Statistical Area Entries
    df[~df.State.str.contains("Statistical Area")]

    df.to_csv("United_States_Counties_with_URLs.csv", index=False)


if __name__ == "__main__":
    pull_counties()
