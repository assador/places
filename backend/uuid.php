function uuidv4(): string {
	$bin = random_bytes(16);
	$bin[6] = chr((ord($bin[6]) & 0x0f) | 0x40);
	$bin[8] = chr((ord($bin[8]) & 0x3f) | 0x80);
	return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bin), 4));
}
function uuidToBin(?string $uuid): ?string {
	if (
		!is_string($uuid) || !preg_match(
			'/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
			$uuid
		)
	) {
		return null;
	}
	return hex2bin(str_replace('-', '', $uuid));
}
function binToUuid(?string $bin): ?string {
	if (!is_string($bin) || strlen($bin) !== 16) {
		return null;
	}
	$hex = bin2hex($bin);
	return sprintf(
		'%s-%s-%s-%s-%s',
		substr($hex, 0, 8),
		substr($hex, 8, 4),
		substr($hex, 12, 4),
		substr($hex, 16, 4),
		substr($hex, 20, 12)
	);
}
