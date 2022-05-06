require('source-map-support').install();

import * as test from 'tape';
import { FilmicPass } from '../';

test('test', t => {
	t.ok(FilmicPass, 'implement library');
	t.end();
});
