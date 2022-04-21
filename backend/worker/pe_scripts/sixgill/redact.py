"""Functions to redact PII from a dataframe."""
# importing pandas as pd
import pandas as pd
import scrubadub, scrubadub.detectors.date_of_birth
import re

# from presidio_analyzer import AnalyzerEngine
# from presidio_anonymizer import AnonymizerEngine

FL = [
    r"(?:(?<=\s)|(?<=^))[a-zA-Z] \d{3} \d{3} \d{3} \d{3}(?=$|\s)",
    r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{3}-\d{3}-\d{2}-\d{3}-\d(?=$|\s)",
    r"(?:(?<=\s)|(?<=^))[a-zA-Z]-\d{3}-\d{3}-\d{3}-\d{3}(?=$|\s)",
]
HI_NE_VA = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{8}(?=$|\s)"]
IL = [
    r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{3}-\d{4}-\d{4}(?=$|\s)",
    r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{11}(?=$|\s)",
]
MN_FL_MD_MI = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{12}(?=$|\s)"]
MO_OK = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{9}(?=$|\s)"]
MD = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]-\d{3}-\d{3}-\d{3}-\d{3}(?=$|\s)"]

CA = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{7}(?=$|\s)"]
CO = [r"(?:(?<=\s)|(?<=^))\d{2}-\d{3}-\d{4}(?=$|\s)"]
ID = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]{2}\d{6}[a-zA-Z](?=$|\s)"]
IO = [r"(?:(?<=\s)|(?<=^))\d{4}-\d{2}-\d{4}(?=$|\s)"]
IA = [r"(?:(?<=\s)|(?<=^))\d{3}[a-zA-Z]{2}\d{4}(?=$|\s)"]
KS = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{2}-\d{2}-\d{4}(?=$|\s)"]
KY = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{2}-\d{3}-\d{3}(?=$|\s)"]
MI = [r"(?:(?<=\s)|(?<=^))[a-zA-Z] \d{3} \d{3} \d{3} \d{3}(?=$|\s)"]
NH = [
    r"(?:(?<=\s)|(?<=^))([0][1-9]|[1][0-2])[a-zA-Z]{3}\d{2}(0[1-9]|[1-2][0-9]|3[0-1])\d(?=$|\s)"
]
NJ = [
    r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{4}-\d{5}-\d{5}(?=$|\s)",
    r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{14}(?=$|\s)",
]
NY = [r"(?:(?<=\s)|(?<=^))\d{3} \d{3} \d{3}(?=$|\s)"]
ND = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]{3}-\d{2}-\d{4}(?=$|\s)"]
OH = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]{3}-\d{2}-\d{4}(?=$|\s)"]
PA = [r"(?:(?<=\s)|(?<=^))\d{2} \d{3} \d{3}(?=$|\s)"]
VT = [r"(?:(?<=\s)|(?<=^))\d{7}[a-zA-Z](?=$|\s)"]
VA = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{2}-\d{2}-\d{4}(?=$|\s)"]
WA = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]{3}\*\*[a-zA-Z]{2}\d{3}[a-zA-Z]\d(?=$|\s)"]
WV = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{6}(?=$|\s)"]
WI = [r"(?:(?<=\s)|(?<=^))[a-zA-Z]\d{3}-\d{4}-\d{4}-\d{2}(?=$|\s)"]
WY = [r"(?:(?<=\s)|(?<=^))\d{6}-\d{3}(?=$|\s)"]

# Build detectors to find Drivers License ID
class FL_DLFilth(scrubadub.filth.Filth):
    type = "FL_drivers_license"
class FL_DLDetector(scrubadub.detectors.RegexDetector):
    name = "FL_drivers_license"
    regex = re.compile("|".join(FL), re.IGNORECASE)
    filth_cls = FL_DLFilth

class HI_NE_VA_DLFilth(scrubadub.filth.Filth):
    type = "HI_NE_VA_drivers_license"
class HI_NE_VA_DLDetector(scrubadub.detectors.RegexDetector):
    name = "HI_NE_VA_drivers_license"
    regex = re.compile("|".join(HI_NE_VA), re.IGNORECASE)
    filth_cls = HI_NE_VA_DLFilth

class IL_DLFilth(scrubadub.filth.Filth):
    type = "IL_drivers_license"
class IL_DLDetector(scrubadub.detectors.RegexDetector):
    name = "IL_drivers_license"
    regex = re.compile("|".join(IL), re.IGNORECASE)
    filth_cls = IL_DLFilth

class MN_FL_MD_MI_DLFilth(scrubadub.filth.Filth):
    type = "MN_FL_MD_MI_drivers_license"
class MN_FL_MD_MI_DLDetector(scrubadub.detectors.RegexDetector):
    name = "MN_FL_MD_MI_drivers_license"
    regex = re.compile("|".join(MN_FL_MD_MI), re.IGNORECASE)
    filth_cls = MN_FL_MD_MI_DLFilth

class MO_OK_DLFilth(scrubadub.filth.Filth):
    type = "MO_OK_drivers_license"
class MO_OK_DLDetector(scrubadub.detectors.RegexDetector):
    name = "MO_OK_drivers_license"
    regex = re.compile("|".join(MO_OK), re.IGNORECASE)
    filth_cls = MO_OK_DLFilth

class MD_DLFilth(scrubadub.filth.Filth):
    type = "MD_drivers_license"
class MD_DLDetector(scrubadub.detectors.RegexDetector):
    name = "MD_drivers_license"
    regex = re.compile("|".join(MD), re.IGNORECASE)
    filth_cls = MD_DLFilth

class CA_DLFilth(scrubadub.filth.Filth):
    type = "ca_drivers_license"
class CA_DLDetector(scrubadub.detectors.RegexDetector):
    name = "ca_drivers_license"
    regex = re.compile("|".join(CA), re.IGNORECASE)
    filth_cls = CA_DLFilth

class CO_DLFilth(scrubadub.filth.Filth):
    type = "co_drivers_license"
class CO_DLDetector(scrubadub.detectors.RegexDetector):
    name = "co_drivers_license"
    regex = re.compile("|".join(CO), re.IGNORECASE)
    filth_cls = CO_DLFilth

class ID_DLFilth(scrubadub.filth.Filth):
    type = "ID_drivers_license"
class ID_DLDetector(scrubadub.detectors.RegexDetector):
    name = "ID_drivers_license"
    regex = re.compile("|".join(ID), re.IGNORECASE)
    filth_cls = ID_DLFilth

class IO_DLFilth(scrubadub.filth.Filth):
    type = "IO_drivers_license"
class IO_DLDetector(scrubadub.detectors.RegexDetector):
    name = "IO_drivers_license"
    regex = re.compile("|".join(IO), re.IGNORECASE)
    filth_cls = IO_DLFilth

class IA_DLFilth(scrubadub.filth.Filth):
    type = "IA_drivers_license"
class IA_DLDetector(scrubadub.detectors.RegexDetector):
    name = "IA_drivers_license"
    regex = re.compile("|".join(IA), re.IGNORECASE)
    filth_cls = IA_DLFilth

class KS_DLFilth(scrubadub.filth.Filth):
    type = "KS_drivers_license"
class KS_DLDetector(scrubadub.detectors.RegexDetector):
    name = "KS_drivers_license"
    regex = re.compile("|".join(KS), re.IGNORECASE)
    filth_cls = KS_DLFilth

class KY_DLFilth(scrubadub.filth.Filth):
    type = "KY_drivers_license"
class KY_DLDetector(scrubadub.detectors.RegexDetector):
    name = "KY_drivers_license"
    regex = re.compile("|".join(KY), re.IGNORECASE)
    filth_cls = KY_DLFilth

class MI_DLFilth(scrubadub.filth.Filth):
    type = "MI_drivers_license"
class MI_DLDetector(scrubadub.detectors.RegexDetector):
    name = "MI_drivers_license"
    regex = re.compile("|".join(MI), re.IGNORECASE)
    filth_cls = MI_DLFilth

class NH_DLFilth(scrubadub.filth.Filth):
    type = "NH_drivers_license"
class NH_DLDetector(scrubadub.detectors.RegexDetector):
    name = "NH_drivers_license"
    regex = re.compile("|".join(NH), re.IGNORECASE)
    filth_cls = NH_DLFilth

class NJ_DLFilth(scrubadub.filth.Filth):
    type = "NJ_drivers_license"
class NJ_DLDetector(scrubadub.detectors.RegexDetector):
    name = "NJ_drivers_license"
    regex = re.compile("|".join(NJ), re.IGNORECASE)
    filth_cls = NJ_DLFilth

class NY_DLFilth(scrubadub.filth.Filth):
    type = "NY_drivers_license"
class NY_DLDetector(scrubadub.detectors.RegexDetector):
    name = "NY_drivers_license"
    regex = re.compile("|".join(NY), re.IGNORECASE)
    filth_cls = NY_DLFilth

class ND_DLFilth(scrubadub.filth.Filth):
    type = "ND_drivers_license"
class ND_DLDetector(scrubadub.detectors.RegexDetector):
    name = "ND_drivers_license"
    regex = re.compile("|".join(ND), re.IGNORECASE)
    filth_cls = ND_DLFilth

class OH_DLFilth(scrubadub.filth.Filth):
    type = "OH_drivers_license"
class OH_DLDetector(scrubadub.detectors.RegexDetector):
    name = "OH_drivers_license"
    regex = re.compile("|".join(OH), re.IGNORECASE)
    filth_cls = OH_DLFilth

class PA_DLFilth(scrubadub.filth.Filth):
    type = "PA_drivers_license"
class PA_DLDetector(scrubadub.detectors.RegexDetector):
    name = "PA_drivers_license"
    regex = re.compile("|".join(PA), re.IGNORECASE)
    filth_cls = PA_DLFilth

class VT_DLFilth(scrubadub.filth.Filth):
    type = "VT_drivers_license"
class VT_DLDetector(scrubadub.detectors.RegexDetector):
    name = "VT_drivers_license"
    regex = re.compile("|".join(VT), re.IGNORECASE)
    filth_cls = VT_DLFilth

class VA_DLFilth(scrubadub.filth.Filth):
    type = "VA_drivers_license"
class VA_DLDetector(scrubadub.detectors.RegexDetector):
    name = "VA_drivers_license"
    regex = re.compile("|".join(VA), re.IGNORECASE)
    filth_cls = VA_DLFilth

class WA_DLFilth(scrubadub.filth.Filth):
    type = "WA_drivers_license"
class WA_DLDetector(scrubadub.detectors.RegexDetector):
    name = "WA_drivers_license"
    regex = re.compile("|".join(WA), re.IGNORECASE)
    filth_cls = WA_DLFilth

class WV_DLFilth(scrubadub.filth.Filth):
    type = "WV_drivers_license"
class WV_DLDetector(scrubadub.detectors.RegexDetector):
    name = "WV_drivers_license"
    regex = re.compile("|".join(WV), re.IGNORECASE)
    filth_cls = WV_DLFilth

class WI_DLFilth(scrubadub.filth.Filth):
    type = "WI_drivers_license"
class WI_DLDetector(scrubadub.detectors.RegexDetector):
    name = "WI_drivers_license"
    regex = re.compile("|".join(WI), re.IGNORECASE)
    filth_cls = WI_DLFilth

class WY_DLFilth(scrubadub.filth.Filth):
    type = "WY_drivers_license"
class WY_DLDetector(scrubadub.detectors.RegexDetector):
    name = "WY_drivers_license"
    regex = re.compile("|".join(WY), re.IGNORECASE)
    filth_cls = WY_DLFilth

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
    scrubber.remove_detector("url")
    scrubber.remove_detector("twitter")
    scrubber.remove_detector("email")
    scrubber.add_detector(SSNDetector)
    scrubber.add_detector(PassportDetector)
    scrubber.add_detector(AlienIdDetector)
    #Test breaking detectors
    scrubber.add_detector(FL_DLDetector)
    scrubber.add_detector(HI_NE_VA_DLDetector)
    scrubber.add_detector(IL_DLDetector)
    scrubber.add_detector(MN_FL_MD_MI_DLDetector)
    scrubber.add_detector(MO_OK_DLDetector)
    scrubber.add_detector(MD_DLDetector)
    #Working Detectors
    scrubber.add_detector(CA_DLDetector)
    scrubber.add_detector(CO_DLDetector)
    scrubber.add_detector(ID_DLDetector)
    scrubber.add_detector(NJ_DLDetector)
    scrubber.add_detector(NY_DLDetector)
    scrubber.add_detector(ND_DLDetector)
    scrubber.add_detector(OH_DLDetector)
    scrubber.add_detector(PA_DLDetector)
    scrubber.add_detector(VT_DLDetector)
    scrubber.add_detector(VA_DLDetector)
    scrubber.add_detector(WA_DLDetector)
    scrubber.add_detector(WV_DLDetector)
    scrubber.add_detector(WI_DLDetector)
    scrubber.add_detector(WY_DLDetector)
    scrubber.add_detector(NH_DLDetector)
    scrubber.add_detector(IO_DLDetector)
    scrubber.add_detector(IA_DLDetector)
    scrubber.add_detector(KS_DLDetector)
    scrubber.add_detector(KY_DLDetector)
    scrubber.add_detector(MI_DLDetector)
    scruby = lambda x: scrubber.clean(x)
    df[column] = df[column].apply(scruby)
    # analyzer = AnalyzerEngine()
    # anonymizer = AnonymizerEngine()
    # entities = ["PHONE_NUMBER","CREDIT_CARD","US_DRIVER_LICENSE","US_SSN","EMAIL_ADDRESS","IP_ADDRESS"]
    # scrub_2 = lambda x: anonymizer.anonymize(text=x,analyzer_results=analyzer.analyze(text=x,entities=entities,language='en')).text
    # df[column] = df[column].apply(scrub_2)
    return df
    