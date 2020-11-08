generate_id:
	npx nanoid-cli --size 10 --alphabet "0123456789"

start_adr:
	cp ./templates/adr.md ./adrs/draft/README.md
