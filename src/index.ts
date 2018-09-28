import {fetchEpisodes} from "./ivoxFetcher";

async function main() {
    const episodes = await fetchEpisodes('https://www.ivoox.com/turbo-3_fg_f157926_filtro_1.xml');
    console.log(episodes.length)    ;
}

main().catch(e => console.error(e));
