airdrop:
	@while true; do solana airdrop 1; sleep 30; done

airdrop-wallet:
	@while true; do solana airdrop 1 7ADLt8RQX6W5v7L4voBxY9WcT7xRVis9rgbaUTpvEQ4w; sleep 30; done

set-devnet:
	@solana config set --url https://api.devnet.solana.com

set-localnet:
	@solana config set --url http://127.0.0.1:8899

setup:
	@cargo install --git https://github.com/project-serum/anchor --tag v0.16.2 anchor-cli --locked

test-localnet:
	@anchor --provider.cluster http://127.0.0.1:8899 build
	@anchor --provider.cluster http://127.0.0.1:8899 deploy
	@anchor --provider.cluster http://127.0.0.1:8899 test --skip-local-validator --skip-deploy --skip-build

test-skip:
	@anchor test --skip-local-validator --skip-deploy --skip-build
