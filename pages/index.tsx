import { GetServerSideProps } from 'next';
import { parse, serialize } from 'cookie';
import { MeResponse, Spotify } from '../src/spotify';
import { Layout } from '../components/Layout';

type Props = {
  me: MeResponse['body'] | null;
  authUrl: string;
};

export default function Index(props: Props) {
  return (
    <Layout>
      {!props.me && (
        <>
          <div>Not logged in </div>
          <div className="my-3">
            <a
              href={props.authUrl}
              className="bg-green-500 py-2 px-6 rounded-md text-white"
            >
              Log in with Spotify
            </a>
          </div>
        </>
      )}
      {props.me && <div>Logged in as {props.me.display_name}</div>}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async context => {
  const cookies = parse(context.req.headers.cookie as string ?? '');
  const accessToken = cookies.accessToken ?? null;
  const refreshToken = cookies.refreshToken ?? null;

  const spotify = new Spotify();
  let me: MeResponse['body'] | null = null;
  if (accessToken && refreshToken) {
    try {
      spotify.auth(accessToken, refreshToken);
      me = await spotify.getMe();
    } catch (e) {
      context.res.setHeader('Set-Cookie', serialize('accessToken', '', { maxAge: -1 }))
      context.res.setHeader('Set-Cookie', serialize('refreshToken', '', { maxAge: -1 }))
    }
  }

  const authUrl = await spotify.getAuthorizeUrl();

  return { props: { me, authUrl } };
};
