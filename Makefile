ship:
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" anchor build
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" anchor deploy
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" mocha -t 1000000 tests/

mocha:
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" mocha -t 1000000 tests/

test:
	@anchor test --skip-local-validator
