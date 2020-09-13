import { PropsWithChildren } from 'react';

export function Layout(props: PropsWithChildren<{}>) {
  return (
    <div className="container mx-auto">
      <header>
        <h1 className="text-2xl my-10">Radio3 to Spotify</h1>
      </header>
      {props.children}
    </div>
  );
}
