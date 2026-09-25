declare module "pg" {
  export interface QueryResult<T=Record<string, any>> { rows: T[]; rowCount: number; }
  export interface PoolOptions {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    maxUses?: number;
    ssl?: unknown;
  }
  export class PoolClient {
    query<T=Record<string, any>>(text:string,values?:readonly unknown[]):Promise<QueryResult<T>>;
    release(err?:Error):void;
  }
  export class Pool {
    constructor(options?:PoolOptions);
    query<T=Record<string, any>>(text:string,values?:readonly unknown[]):Promise<QueryResult<T>>;
    connect():Promise<PoolClient>;
    end():Promise<void>;
  }
}