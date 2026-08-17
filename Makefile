generate_adr_id:
	npx nanoid-cli --size 10 --alphabet "0123456789"

start_adr:
	./scripts/start_adr.sh

start_radar_item:
	./scripts/start_radar_item.sh "$(name)" "$(slug)"
