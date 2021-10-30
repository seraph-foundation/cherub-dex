airdrop:
	@while true; do solana airdrop 1; sleep 30; done

build-frontend:
	@cd app && yarn build

cli-main:
	@ANCHOR_PROVIDER_URL=https://api.devnet.solana.com node cli/main.js

set-devnet:
	@solana config set --url https://api.devnet.solana.com

set-localnet:
	@solana config set --url http://127.0.0.1:8899

setup-linux:
	@apt-get update -y
	@curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	@source ~/.cargo/env
	@sh -c "$(curl -sSfL https://release.solana.com/v1.8.0/install)"
	@curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
	@npm i -g mocha @project-serum/anchor-cli@0.16.2
	@solana-keygen new -o ~/.config/solana/id.json
	@solana airdrop 5
	@npm install

test-localnet:
	@anchor --provider.cluster http://127.0.0.1:8899 test

test-skip:
	@anchor test --skip-local-validator --skip-deploy --skip-build
