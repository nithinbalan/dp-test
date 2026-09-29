/**
 * Branded primitives. A plain `string` id can be passed anywhere another string
 * id is expected — which is precisely the class of bug that leaks data across
 * workspaces. See docs/WORKSPACE_ISOLATION.md §4.
 */
declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type UserId = Brand<string, 'UserId'>;
/** A validated Postgres schema identifier. Only the workspace registry can mint one. */
export type SchemaName = Brand<string, 'SchemaName'>;
