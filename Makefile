generate_adr_id:
	npx nanoid-cli --size 10 --alphabet "0123456789"

start_adr:
	./scripts/start_adr.sh

yarn-upgrade-stable:
	yarn set version stable
	yarn dlx @yarnpkg/sdks vscode
