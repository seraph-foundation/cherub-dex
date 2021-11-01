setup:
	@apt-get update -y
	@curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	@source ~/.cargo/env
	@sh -c "$(curl -sSfL https://release.solana.com/v1.8.0/install)"
	@curl -sL https://deb.nodesource.com/setup_14.x | sudo bash -
	@npm i -g mocha @project-serum/anchor-cli@0.16.2
	@solana-keygen new -o ~/.config/solana/id.json
	@solana airdrop 5
	@npm install
