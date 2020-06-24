export declare global {
  interface Window {
    grecaptcha: {
      execute: (key: string, action: any) => Promise<string>;
    };
  }
}
