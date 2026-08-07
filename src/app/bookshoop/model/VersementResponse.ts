import { VersementClient } from "./versement-client";

export interface VersementResponse extends VersementClient {
  messageRetour?: string;
}