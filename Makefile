ship:
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" anchor build
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" anchor deploy
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" mocha -t 1000000 tests/

mocha:
	@ANCHOR_PROVIDER_URL="http://127.0.0.1:8899" ANCHOR_WALLET="~/.config/solana/id.json" mocha -t 1000000 tests/

test:
	@anchor --provider.cluster http://127.0.0.1:8899 build
	@anchor --provider.cluster http://127.0.0.1:8899 deploy
	@anchor --provider.cluster http://127.0.0.1:8899 test --skip-local-validator --skip-deploy --skip-build

test-skip:
	@anchor test --skip-local-validator --skip-deploy --skip-build

validator:
	@solana-test-validator \
		--bpf-program FyuPaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS ./target/deploy/factory.so \
		--bpf-program Fx9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS ./target/deploy/exchange.so \
		--bpf-program Fz9PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS ./target/deploy/pyth.so
