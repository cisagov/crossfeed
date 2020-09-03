import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  AuthContext,
  AuthContextType,
  defaultAuthContext
} from './context/AuthContext';

interface CustomRenderOptions extends RenderOptions {
  initialHistory?: string[];
  authContext?: Partial<AuthContextType>;
}

const customRender = (ui: any, options: CustomRenderOptions = {}) => {
  const { initialHistory, authContext, ...rest } = options;

  // Provide any context that the components may be expecting
  const Wrapper: React.FC = ({ children }) => (
    <MemoryRouter initialEntries={initialHistory}>
      <AuthContext.Provider
        value={{
          ...defaultAuthContext,
          ...authContext
        }}
      >
        {children}
      </AuthContext.Provider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper, ...rest });
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
