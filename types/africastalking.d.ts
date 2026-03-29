declare module "africastalking" {
  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }
  interface SMS {
    send(options: SMSSendOptions): Promise<unknown>;
  }
  interface AfricasTalkingInstance {
    SMS: SMS;
  }
  interface AfricasTalkingOptions {
    apiKey: string;
    username: string;
  }
  function AfricasTalking(options: AfricasTalkingOptions): AfricasTalkingInstance;
  export = AfricasTalking;
}
