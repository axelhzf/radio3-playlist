import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { Spotify } from '../../services/spotify';
import { isArray } from 'lodash';
import { ParsedUrlQuery } from 'querystring';
import { serialize } from 'cookie';
import { Layout } from '../../components/Layout';

type Props = {
  error?: string;
};

export default function SpotifyAuth(props: Props) {
  return (
    <Layout>
      {props.error && <div>There was an error: {props.error}</div>}
      {!props.error && (
        <div>
          Authenticated.{' '}
          <Link href="/">
            <a>Go home</a>
          </Link>
        </div>
      )}
    </Layout>
  );
}

function getParam(query: ParsedUrlQuery, key: string): string | undefined {
  const val = query[key];
  return isArray(val) ? val[0] : val;
}

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const code = getParam(context.query, 'code');
  if (!code) {
    return { props: { error: 'Invalid code ' } };
  }
  try {
    const spotify = new Spotify();
    const { accessToken, refreshToken, expiresIn } = await spotify.getToken(code);
    context.res.setHeader('Set-Cookie', [
      serialize('accessToken', accessToken, { maxAge: expiresIn, path: '/' }),
      serialize('refreshToken', refreshToken, { maxAge: 31536000, path: '/' }),
    ]);
  } catch (e) {
    return { props: { error: e.message } };
  }
  return { props: { error: null } };
};
