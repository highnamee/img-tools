export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center p-10 text-center">
      <h1 className="mb-10 text-7xl font-bold text-red-900">Oops</h1>
      <div className="mb-4 text-xl font-bold">Something went wrong</div>
      <div className="text-lg">
        <span>Please contact the author at </span>
        <a href="https://github.com/highnamee/img-tools" className="text-red-900">
          https://github.com/highnamee/img-tools
        </a>
      </div>
    </div>
  );
}
