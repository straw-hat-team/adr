import Button from "../components/button";

export function IndexRoute() {
  return (
    <div className="flex flex-col items-center justify-center mt-10 w-screen h-screen">
      <h1 className="font-normal text-5xl mb-10">Hello, World!</h1>
      <Button>Click me 🚀!</Button>
    </div>
  )
}
