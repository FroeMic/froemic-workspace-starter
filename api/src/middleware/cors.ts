// Let Mastra handle CORS through its configuration
export const corsMiddleware = async (c: any, next: any) => {
  await next();
};