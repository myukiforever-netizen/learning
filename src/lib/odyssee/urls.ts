// Les identifiants (ex. « psychologie/bases ») contiennent une barre oblique :
// dans une adresse, on la remplace par un tilde, jamais présent dans un id.
export function versUrl(id: string): string {
  return id.replaceAll("/", "~");
}

export function depuisUrl(segment: string): string {
  return decodeURIComponent(segment).replaceAll("~", "/");
}

export const routes = {
  univers: () => "/",
  galaxie: (id: string) => `/galaxie/${versUrl(id)}`,
  soleil: (id: string) => `/galaxie/${versUrl(id)}/soleil`,
  planete: (id: string) => `/planete/${versUrl(id)}`,
  phase: (id: string, phase: "decouverte" | "comprehension" | "entrainement" | "mission") => `/planete/${versUrl(id)}/${phase}`,
  patrouille: () => "/patrouille",
};
