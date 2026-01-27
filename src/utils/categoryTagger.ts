interface GooglePlace {
	primaryTypeDisplayName?: {
		text?: string;
	};
	displayName?: {
		text?: string;
	};
	editorialSummary?: {
		text?: string;
	};
	primaryType?: string;
	// other properties
}

export const getCustomCategory = (place: GooglePlace): string | undefined => {
	if (place.primaryTypeDisplayName?.text === 'Halal restaurant') {
		return 'American Halal';
	}

	const displayName = place.displayName?.text?.toLowerCase() || '';
	if (
		displayName.includes('halal') &&
		(displayName.includes('munchies') || displayName.includes('grill') || displayName.includes('guys'))
	) {
		return 'American Halal';
	}

	const summary = place.editorialSummary?.text?.toLowerCase() || '';
	if (summary.includes('chicken over rice') || summary.includes('nyc style')) {
		return 'American Halal';
	}

	return place.primaryType;
};
