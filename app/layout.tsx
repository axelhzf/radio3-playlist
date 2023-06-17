import './main.css';

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container mx-auto">
          <header>
            <h1 className="text-2xl my-10">Radio3 to Spotify</h1>
          </header>

          {props.children}
        </div>
      </body>
    </html>
  );
}
