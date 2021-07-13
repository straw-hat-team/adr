export default function Button({ children }) {
  return (
    <button className="rounded border border-black-500 py-4 px-8 pointer font-normal">
      {children}
    </button>
  )
}
