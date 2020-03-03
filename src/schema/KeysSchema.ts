import { ObjectType, Field, Int, InputType } from "type-graphql";

@InputType()
export class Keys {
  @Field(type => Int)
  id: number;
}

@ObjectType()
export class SuccessResponse {
  @Field(type => String)
  msg?: string;

  @Field(type => String)
  code?: string;
}
