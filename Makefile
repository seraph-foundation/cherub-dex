airdrop:
	@while true; do solana airdrop 1; sleep 30; done

build-frontend:
	@cd app && yarn build

set-devnet:
	@solana config set --url https://api.devnet.solana.com

set-localnet:
	@solana config set --url http://127.0.0.1:8899

setup:
	@cargo install --git https://github.com/project-serum/anchor --tag v0.16.2 anchor-cli --locked

test-localnet:
	@anchor --provider.cluster http://127.0.0.1:8899 test

test-skip:
	@anchor test --skip-local-validator --skip-deploy --skip-build
