import { Directory, File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";

export function guardarFotoAnimal(uriTemporal: string) {
  const carpeta = new Directory(Paths.document, "animales");
  carpeta.create({ idempotent: true, intermediates: true });
  const extension = uriTemporal.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1] || "jpg";
  const destino = new File(carpeta, `${Crypto.randomUUID()}.${extension}`);
  new File(uriTemporal).copy(destino);
  return destino.uri;
}
