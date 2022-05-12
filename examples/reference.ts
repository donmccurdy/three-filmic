const REFERENCE = {
	looks: [
		'very_high',
		'high',
		'medium_high',
		'medium',
		'medium_low',
		'low',
		'very_low',
		'false_color',
	],
};

const mainEl = document.querySelector('main')!;

for (const look of REFERENCE.looks) {
	const sectionEl = document.createElement('section');
	mainEl.appendChild(sectionEl);
	sectionEl.innerHTML = `
<h2>${look}</h2>
<figure>
    <img src="http://placehold.jp/960x540.png" alt="">
    <img src="/assets/reference/out/${look}.png" alt="">
</figure>
    `.trim();
}
