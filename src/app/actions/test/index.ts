"use server";
export async function test() {
  const res = await (
    await fetch("http://localhost:3000/api/py/helloFastApi", {
      method: "GET",
    })
  ).json();
  return res;
}
