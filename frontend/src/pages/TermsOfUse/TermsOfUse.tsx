import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AuthForm } from 'components';
import { Button, Checkbox } from '@trussworks/react-uswds';
import { useAuthContext } from 'context';
import { User } from 'types';

interface FormData {
  firstName: string;
  lastName: string;
  organization?: string;
}

interface Errors extends Partial<FormData> {
  global?: string;
}

export const TermsOfUse: React.FC = () => {
  const history = useHistory();
  const [accepted, setAccepted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const { user, setUser, apiPost, maximumRole, touVersion } = useAuthContext();

  const onSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    try {
      if (!accepted) throw Error('Must accept terms');
      const updated: User = await apiPost(`/users/me/acceptTerms`, {
        body: { version: touVersion }
      });

      setUser(updated);
      history.push('/', {
        message: 'Your account has been successfully created.'
      });
    } catch (e: any) {
      setErrors({
        global: e.message ?? e.toString()
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Terms of Use</h1>
      <p>You must read and sign the Terms of Use before using Crossfeed.</p>
      <p>
        Crossfeed is a free, self-service tool offered by the Department of
        Homeland Security’s Cybersecurity and Infrastructure Security Agency
        (CISA). Using both passive and active processes, Crossfeed can
        continuously evaluate the cybersecurity posture of your public-facing,
        internet-accessible network assets for vulnerabilities or configuration
        issues.
      </p>
      <p>
        Crossfeed supports two types of users for your organization:
        administrative users or view-only users. Administrative users can
        add/delete domains for their organization, schedule and disable scans
        for their organization, and invite others to create Crossfeed accounts
        to have access to the organization’s data. View-only users can only view
        data provided to or collected by Crossfeed.
      </p>
      {maximumRole === 'admin' && (
        <p>
          Once you create a Crossfeed administrator account, input the Internet
          Protocol (IP) addresses or domains to be continuously evaluated, and
          select the scanning/evaluation protocols to be used, Crossfeed will
          collect data about the sites you specified from multiple
          publicly-available resources, including through active interactions
          with your sites, if that option is selected by you. Crossfeed will
          also examine any publicly-available, internet-accessible resources
          that appear to be related or otherwise associated with IPs or domains
          you have provided us to evaluate, presenting you with a list of those
          related sites for your awareness.
        </p>
      )}
      <p>
        By creating a Crossfeed{' '}
        {maximumRole === 'admin' ? 'administrator' : 'view only'} account and
        using this service, you request CISA’s technical assistance to detect
        vulnerabilities and configuration issues through Crossfeed and agree to
        the following:
      </p>
      <ul>
        {maximumRole === 'admin' && (
          <>
            <li>
              You have authority to authorize scanning/evaluation of the
              public-facing networks and systems you submit within Crossfeed and
              you authorize CISA to conduct any such scans/evaluation through
              Crossfeed;
            </li>
            <li>
              You agree to promptly update or change the information used to
              identify the public-facing networks and systems to be
              scanned/evaluated pursuant to this authorization;
            </li>
            <li>
              You agree to comply with any notification or authorization
              requirement that any third party that operates or maintains your
              public-facing networks or systems may impose on external
              vulnerability scanning services, modifying any Crossfeed scans
              associated with your account if external scanning of those
              resources is later prohibited;
            </li>
            <li>
              You accept that, while Crossfeed will use best efforts to conduct
              scans in a way that minimizes risk to your organization’s systems
              and networks, Crossfeed scanning activities creates some risk of
              degradation in performance to your organization’s systems and
              networks;
            </li>
            <li>
              You agree that CISA may share data gathered by Crossfeed with
              other federal agencies with cybersecurity responsibilities, with
              the Multi-State Information Sharing and Analysis Center, and with
              the Election Infrastructure Information Sharing and Analysis
              Center;
            </li>
            <li>
              You are authorized to make the above certifications on your
              organization’s behalf;
            </li>
          </>
        )}
        <li>
          You accept that CISA may modify or discontinue the Crossfeed service
          at any time;
        </li>
        <li>
          You acknowledge that use of Crossfeed is governed exclusively by
          federal law and that CISA provides no warranties of any kind relating
          to any aspect of your use of Crossfeed, including that Crossfeed may
          detect only a limited range of vulnerabilities or configuration issues
          and that there is no guarantee that Crossfeed will detect any or all
          vulnerabilities or configuration issues present in your system;
        </li>
        <li>
          You agree to not:
          <ul>
            <li>
              Use the Crossfeed service in violation of any applicable law;
            </li>
            <li>
              Access or attempt to access any Crossfeed account other than your
              own; and
            </li>
            <li>
              Introduce malware to the Crossfeed platform or otherwise impair,
              harm, or disrupt the functioning or integrity of the platform in
              any way;
            </li>
          </ul>
        </li>
        <li>
          You accept that, at CISA’s sole discretion, CISA may terminate or
          suspend your access to the Crossfeed service due to violation of these
          terms or any other reason.
        </li>
      </ul>
      <p>ToU version {touVersion}</p>
      <Checkbox
        required
        id="accept"
        name="accept"
        label="I accept the above Terms and Conditions."
        checked={accepted}
        onChange={(e) => setAccepted(e.target.checked)}
      />
      <p style={{ marginBottom: 0 }}>
        <strong>Name:</strong> {user?.fullName}
      </p>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>
      <div className="width-full display-flex flex-justify-start">
        {errors.global && <p className="text-error">{errors.global}</p>}
      </div>
      <Button type="submit">Submit</Button>
    </AuthForm>
  );
};
