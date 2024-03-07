import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, AuthContextType } from '../context/AuthContext';
import { CFThemeContextProvider } from 'context';
import { authCtx } from './authCtx';

interface CustomRenderOptions extends RenderOptions {
  initialHistory?: string[];
  authContext?: Partial<AuthContextType>;
}

const customRender = (ui: any, options: CustomRenderOptions = {}) => {
  const { initialHistory, authContext, ...rest } = options;

  // Provide any context that the components may be expecting
  const Wrapper: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
    <CFThemeContextProvider>
      <MemoryRouter initialEntries={initialHistory}>
        <AuthContext.Provider
          value={{
            ...authCtx,
            ...authContext
          }}
        >
          {children}
        </AuthContext.Provider>
      </MemoryRouter>
    </CFThemeContextProvider>
  );
  return render(ui, { wrapper: Wrapper, ...rest });
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
