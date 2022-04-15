"""Functions to redact PII from a dataframe."""
# importing pandas as pd
import pandas as pd
import scrubadub, scrubadub.detectors.date_of_birth
import regex as re

# from presidio_analyzer import AnalyzerEngine
# from presidio_anonymizer import AnonymizerEngine

CA = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{7}(?=$|\s)"]
CO = ["(?:(?<=\s)|(?<=^))\\d{2}-\\d{3}-\\d{4}(?=$|\s)"]
FL = [
    "(?:(?<=\s)|(?<=^))[a-zA-Z] \\d{3} \\d{3} \\d{3} \\d{3}(?=$|\s)",
    "(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{3}-\\d{3}-\\d{2}-\\d{3}-\\d(?=$|\s)",
    "(?:(?<=\s)|(?<=^))[a-zA-Z]-\\d{3}-\\d{3}-\\d{3}-\\d{3}(?=$|\s)",
]
HI_NE_VA = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{8}(?=$|\s)"]
ID = ["(?:(?<=\s)|(?<=^))[a-zA-Z]{2}\\d{6}[a-zA-Z](?=$|\s)"]
IL = [
    "(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{3}-\\d{4}-\\d{4}(?=$|\s)",
    "(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{11}(?=$|\s)",
]
IO = ["(?:(?<=\s)|(?<=^))\\d{4}-\\d{2}-\\d{4}(?=$|\s)"]
IA = ["(?:(?<=\s)|(?<=^))\\d{3}[a-zA-Z]{2}\\d{4}(?=$|\s)"]
KS = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{2}-\\d{2}-\\d{4}(?=$|\s)"]
KY = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{2}-\\d{3}-\\d{3}(?=$|\s)"]
MD = ["(?:(?<=\s)|(?<=^))[a-zA-Z]-\\d{3}-\\d{3}-\\d{3}-\\d{3}(?=$|\s)"]
MI = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\s\\d{3}\\s\\d{3}\\s\\d{3}\\s\\d{3}(?=$|\s)"]
MN_FL_MD_MI = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{12}(?=$|\s)"]
MO_OK = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{9}(?=$|\s)"]
NH = [
    "(?:(?<=\s)|(?<=^))([0][1-9]|[1][0-2])[a-zA-Z]{3}\\d{2}(0[1-9]|[1-2][0-9]|3[0-1])\\d(?=$|\s)"
]
NJ = [
    "(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{4}-\\d{5}-\\d{5}(?=$|\s)",
    "(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{14}(?=$|\s)",
]
NY = ["(?:(?<=\s)|(?<=^))\\d{3} \\d{3} \\d{3}(?=$|\s)"]
ND = ["(?:(?<=\s)|(?<=^))[a-zA-Z]{3}-\\d{2}-\\d{4}(?=$|\s)"]
OH = ["(?:(?<=\s)|(?<=^))[a-zA-Z]{3}-\\d{2}-\\d{4}(?=$|\s)"]
PA = ["(?:(?<=\s)|(?<=^))\\d{2}\\s\\d{3}\\s\\d{3}(?=$|\s)"]
VT = ["(?:(?<=\s)|(?<=^))\\d{7}[a-zA-Z](?=$|\s)"]
VA = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{2}-\\d{2}-\\d{4}(?=$|\s)"]
WA = ["(?:(?<=\s)|(?<=^))[a-zA-Z]{3}\\*\\*[a-zA-Z]{2}\\d{3}[a-zA-Z]\\d(?=$|\s)"]
WV = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{6}(?=$|\s)"]
WI = ["(?:(?<=\s)|(?<=^))[a-zA-Z]\\d{3}-\\d{4}-\\d{4}-\\d{2}(?=$|\s)"]
WY = ["(?:(?<=\s)|(?<=^))\\d{6}-\\d{3}(?=$|\s)"]

all_DL = (
    CA
    + CO
    + FL
    + HI_NE_VA
    + ID
    + IL
    + IO
    + IA
    + KS
    + KY
    + MD
    + MI
    + MN_FL_MD_MI
    + MO_OK
    + NJ
    + NY
    + ND
    + OH
    + PA
    + VT
    + VA
    + WA
    + WV
    + WI
    + WY
    + NH
)
# all_DL = IA
# Build a detector to find Drivers License ID
class DLFilth(scrubadub.filth.Filth):
    type = "drivers_license"


class DLDetector(scrubadub.detectors.RegexDetector):
    name = "drivers_license"
    regex = re.compile("|".join(all_DL), re.IGNORECASE)
    filth_cls = DLFilth


# Build a detector to find Social security numbers with no spaces
class SSNFilth(scrubadub.filth.Filth):
    type = "no_space_social_security_number"


class SSNDetector(scrubadub.detectors.RegexDetector):
    name = "no_space_ssn"
    regex = re.compile(
        "(?:(?<=\s)|(?<=^))(social security number|Social Security No|Social Security #|social security number|social|Social|ssn)\W*(?!219099999|078051120)(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}(?=$|\s)",
        re.IGNORECASE,
    )
    filth_cls = SSNFilth


# Build a detector that finds passport numbers based off of previous context
class PassportFilth(scrubadub.filth.Filth):
    type = "passport"


class PassportDetector(scrubadub.detectors.RegexDetector):
    name = "passport"
    regex = re.compile(
        "(Passport Number|Passport No|Passport #|Passport#|PassportID|Passportno|passportnumber)\W*\d{9}",
        re.IGNORECASE,
    )
    filth_cls = PassportFilth


# Build a detector that identifies Alien Id numbers
class AlienIdFilth(scrubadub.filth.Filth):
    type = "alien id"


class AlienIdDetector(scrubadub.detectors.RegexDetector):
    name = "alien id"
    regex = re.compile(
        "^(([A-Za-z]{3}[0-9]{10})|([A-Za-z]{3}(\s)([0-9]{2}(\s)[0-9]{3}(\s)[0-9]{5})))$",
        re.IGNORECASE,
    )
    filth_cls = AlienIdFilth


# credit card numbers
email = r"\b([-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*|\"([]!#-[^-~ \t]|(\\[\t -~]))+\")@([-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*|\[[\t -Z^-~]*])\b"
all_cards = r"\b((4\d{3}|5[1-5]\d{2}|2\d{3}|3[47]\d{1,2})[\s\-]?\d{4,6}[\s\-]?\d{4,6}?([\s\-]\d{3,4})?(\d{3})?)\b"
US_phones = r"((\+|\b)[1l][\-\. ])?\(?\b[\dOlZSB]{3,5}([\-\. ]|\) ?)[\dOlZSB]{3}[\-\. ][\dOlZSB]{4}\b"
US_street_address = r"\d{1,8}\b[\s\S]{10,100}?\b(AK|AL|AR|AZ|CA|CO|CT|DC|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b\s\d{5}"


def redact_pii(df, column_list=[]):
    """Run through provided columns and redact PII."""
    # df = df.replace(regex={email: 'email', email2: 'email2', ssn1:'ssn1', ssn2:'ssn2', ssn3:'ssn3', US_phones: 'Phone Number', all_cards:'credit card'})

    if column_list:
        for column in column_list:
            df = scrub(df, column)
            df[column] = df[column].replace(
                regex={
                    all_cards: "{{CREDIT_CARD}}",
                    US_street_address: "{{ADDRESS}}",
                    email: "{{EMAIL}}",
                }
            )
    else:
        for column in df.columns:
            df = scrub(df, column)
        df = df.replace(
            regex={
                all_cards: "{{CREDIT_CARD}}",
                US_street_address: "{{ADDRESS}}",
                email: "{{EMAIL}}",
            }
        )
    return df


def scrub(df, column):
    """Add different scrubber classes and run column through scrubadub."""
    # scrubadub.filth.date_of_birth.DateOfBirthFilth.min_age_years = 5
    scrubber = scrubadub.Scrubber()
    # scrubber.add_detector(scrubadub.detectors.date_of_birth.DateOfBirthDetector())
    scrubber.add_detector(SSNDetector)
    scrubber.add_detector(PassportDetector)
    scrubber.add_detector(AlienIdDetector)
    scrubber.add_detector(DLDetector)
    scrubber.remove_detector("url")
    scrubber.remove_detector("twitter")
    scrubber.remove_detector("email")
    scrub = lambda x: scrubber.clean(x)
    df[column] = df[column].apply(scrub)
    # analyzer = AnalyzerEngine()
    # anonymizer = AnonymizerEngine()
    # entities = ["PHONE_NUMBER","CREDIT_CARD","US_DRIVER_LICENSE","US_SSN","EMAIL_ADDRESS","IP_ADDRESS"]
    # scrub_2 = lambda x: anonymizer.anonymize(text=x,analyzer_results=analyzer.analyze(text=x,entities=entities,language='en')).text
    # df[column] = df[column].apply(scrub_2)
    return df
