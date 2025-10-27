import { InStatement, InValue } from "@libsql/client";

//#region src/utils/sqlite_where_builder.d.ts
type WhereCondition<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Metadata extends Record<string, any> = Record<string, any>> = { [Key in keyof Metadata]: {
  operator: "=" | ">" | "<" | ">=" | "<=" | "<>" | "LIKE";
  value: InValue;
} | {
  operator: "IN";
  value: InValue[];
} };
//#endregion
export { WhereCondition };
//# sourceMappingURL=sqlite_where_builder.d.ts.map