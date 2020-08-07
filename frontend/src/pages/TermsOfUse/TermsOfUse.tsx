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

const termsText = {
  v1: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vitae augue vel lacus pharetra scelerisque vel nec mi. Fusce porta massa nulla, quis tempus elit ullamcorper id. Quisque eros enim, euismod vitae odio et, pellentesque maximus odio. Aenean et nunc non odio consectetur suscipit. Vivamus vel interdum nibh. Praesent consequat ornare lectus, aliquam vestibulum mauris fermentum eget. Curabitur at venenatis mauris, in facilisis metus. Cras at augue lorem. Aliquam erat volutpat. Fusce nec molestie sem. Sed scelerisque efficitur scelerisque. Vestibulum sit amet odio quis purus euismod pulvinar vitae quis magna. Mauris sit amet placerat metus. Ut vitae dui in felis rutrum rhoncus.


  Integer aliquet sit amet quam eu bibendum. Aliquam accumsan pellentesque elit non fermentum. Nunc placerat consectetur turpis, eget iaculis lorem molestie nec. Suspendisse vulputate nulla a elementum consectetur. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Curabitur lobortis, ligula eu viverra sodales, dui mi semper lorem, quis consectetur turpis metus ut sem. Ut ultricies sapien urna, ac gravida leo dictum quis. Cras ante elit, convallis vitae volutpat et, maximus id lorem. Integer et tellus dui. Nam scelerisque tristique erat, non fringilla odio semper at. Donec porttitor, tortor non hendrerit mattis, velit augue ornare lectus, in sodales turpis nunc sed felis. Aenean diam turpis, euismod tincidunt suscipit at, sollicitudin et est. Sed ornare ipsum et nunc malesuada aliquet.
 
  
  Nunc dictum elit ut arcu cursus faucibus in sit amet tortor. Duis ornare eros nisl, non interdum est sodales ac. Nulla nec vulputate nulla, a ullamcorper neque. Suspendisse sagittis nunc eget congue rutrum. Vivamus ornare dolor tincidunt justo commodo fermentum. In vel maximus erat. Maecenas mattis lorem quis faucibus placerat. Donec gravida ligula nec porta suscipit.
  

  Ut et magna quis ex interdum hendrerit. Suspendisse vel felis libero. Cras turpis massa, interdum id nisl eget, auctor vulputate dui. Nulla facilisi. Morbi ornare ullamcorper lectus. Vestibulum laoreet nibh eu nisi laoreet venenatis. Nam nec turpis eros. Curabitur posuere turpis et porttitor eleifend. Aliquam ultrices odio quis enim tempus, nec iaculis eros vestibulum. Morbi nibh enim, mattis eget ipsum nec, dictum eleifend tellus. Vestibulum libero est, pellentesque id faucibus ornare, dignissim hendrerit quam. Praesent ut dui malesuada, eleifend ipsum eget, aliquet quam. Donec maximus augue nec pulvinar tincidunt. Vivamus a laoreet purus. Donec sit amet posuere erat. Fusce elementum felis quis orci eleifend, et cursus augue ullamcorper.
  

  Aenean imperdiet faucibus purus, sed dignissim purus volutpat lacinia. Curabitur in mattis libero. Morbi elementum cursus lacus ac ullamcorper. Aenean pharetra neque id enim rutrum condimentum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu luctus velit, in aliquet tellus. Sed auctor erat tellus, id varius massa egestas ut. Phasellus sed bibendum dui. Nunc faucibus scelerisque dui, quis lacinia purus vulputate a. Fusce interdum, turpis eget consequat rhoncus, lectus lectus bibendum massa, ac finibus nunc ipsum in sapien. Duis eget volutpat erat, vel ultricies massa. Maecenas interdum elit eros, aliquet sollicitudin tellus luctus in. Cras vitae quam nisl. Donec at massa a urna luctus auctor. Sed ac convallis magna, id faucibus nunc. Phasellus efficitur est et odio suscipit, sed tempus nisi tempor.`
};

export const TermsOfUse: React.FC = () => {
  const history = useHistory();
  const [accepted, setAccepted] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [] = useState<{ name: string; id: string }[]>(
    []
  );
  const { user, login, apiPost } = useAuthContext();

  const onSubmit: React.FormEventHandler = async e => {
    e.preventDefault();
    try {
      if (!accepted) throw Error('Must accept terms');
      const updated: User = await apiPost(`/users/me/acceptTerms`, {});

      login(localStorage.getItem('token')!, updated);
      history.push('/', {
        message: 'Your account has been successfully created.'
      });
      // history.push('/');
    } catch (e) {
      setErrors({
        global: e.message ?? e.toString()
      });
    }
  };

  return (
    <AuthForm onSubmit={onSubmit}>
      <h1>Terms of Use</h1>
      <p>
        You must read and sign the Terms of Use before using Crossfeed.
      </p>
      <p>
        {termsText.v1}
      </p>
      <Checkbox
        required
        id="accept"
        name="accept"
        label="I accept the above Terms and Conditions."
        checked={accepted}
        onChange={e => setAccepted(e.target.checked)}
      />
      <p style={{marginBottom: 0}}><strong>Name:</strong> {user?.fullName}</p>
      <p><strong>Email:</strong> {user?.email}</p>
      <div className="width-full display-flex flex-justify-start">
        {errors.global && <p className="text-error">{errors.global}</p>}
      </div>
      <Button type="submit">Submit</Button>
    </AuthForm>
  );
};
