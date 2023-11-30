from __future__ import (absolute_import, division, print_function)
__metaclass__ = type

from ansible.plugins.callback import CallbackBase
from time import gmtime, strftime
import platform
import tempfile
import re
import sys
import os
import xml.etree.ElementTree as ET
import xml.dom.minidom

class CallbackModule(CallbackBase):
    CALLBACK_VERSION = 2.0
    CALLBACK_TYPE = 'xml'
    CALLBACK_NAME = 'stig_xml'

    CALLBACK_NEEDS_WHITELIST = True

    def _get_STIG_path(self):
        cwd = os.path.abspath('.')
        for dirpath, dirs, files in os.walk(cwd):
            if os.path.sep + 'files' in dirpath and '.xml' in files[0]:
                return os.path.join(cwd, dirpath, files[0])

    def __init__(self):
        super(CallbackModule, self).__init__()
        self.rules = {}
        self.stig_path = os.environ.get('STIG_PATH')
        self.XML_path = os.environ.get('XML_PATH')
        if self.stig_path is None:
            self.stig_path = self._get_STIG_path()
        self._display.display('Using STIG_PATH: {}'.format(self.stig_path))
        if self.XML_path is None:
            self.XML_path = tempfile.mkdtemp() + "/xccdf-results.xml"
        self._display.display('Using XML_PATH: {}'.format(self.XML_path))

        print("Writing: {}".format(self.XML_path))
        STIG_name = os.path.basename(self.stig_path)
        ET.register_namespace('cdf', 'http://checklists.nist.gov/xccdf/1.2')
        self.tr = ET.Element('{http://checklists.nist.gov/xccdf/1.2}TestResult')
        self.tr.set('id', 'xccdf_mil.disa.stig_testresult_scap_mil.disa_comp_{}'.format(STIG_name))
        endtime = strftime("%Y-%m-%dT%H:%M:%S", gmtime())
        self.tr.set('end-time', endtime)
        tg = ET.SubElement(self.tr, '{http://checklists.nist.gov/xccdf/1.2}target')
        tg.text = platform.node()

    def _get_rev(self, nid):
        with open(self.stig_path, 'r') as f:
            r = 'SV-{}r(?P<rev>\d+)_rule'.format(nid)
            m = re.search(r, f.read())
        if m:
            rev = m.group('rev')
        else:
            rev = '0'
        return rev

    def v2_runner_on_ok(self, result):
        name = result._task.get_name()
        m = re.search('stigrule_(?P<id>\d+)', name)
        if m:
            nid = m.group('id')
        else:
            return
        rev = self._get_rev(nid)
        key = "{}r{}".format(nid, rev)
        if self.rules.get(key, 'Unknown') != False:
            self.rules[key] = result.is_changed()

    def v2_playbook_on_stats(self, stats):
        for rule, changed in self.rules.items():
            state = 'fail' if changed else 'pass'
            rr = ET.SubElement(self.tr, '{http://checklists.nist.gov/xccdf/1.2}rule-result')
            rr.set('idref', 'xccdf_mil.disa.stig_rule_SV-{}_rule'.format(rule))
            rs = ET.SubElement(rr, '{http://checklists.nist.gov/xccdf/1.2}result')
            rs.text = state
        passing = len(self.rules) - sum(self.rules.values())
        sc = ET.SubElement(self.tr, '{http://checklists.nist.gov/xccdf/1.2}score')
        sc.set('maximum', str(len(self.rules)))
        sc.set('system', 'urn:xccdf:scoring:flat-unweighted')
        sc.text = str(passing)
        with open(self.XML_path, 'wb') as f:
            out = ET.tostring(self.tr)
            pretty = xml.dom.minidom.parseString(out).toprettyxml(encoding='utf-8')
            f.write(pretty)
