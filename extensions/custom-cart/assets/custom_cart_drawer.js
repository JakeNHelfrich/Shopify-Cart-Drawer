class CustomCartDrawer extends HTMLElement {
    constructor() {
        super();

        const updateCart = this.updateCart.bind(this);
        const open = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this.addEventListener("readystatechange", () => {
                if(!url.endsWith("/cart/add.js") && !url.endsWith("/cart/add")) return;
                if(this.readyState !== XMLHttpRequest.DONE) return;
               
                updateCart();
            });
            open.call(this, method, url, async, user, password);
        };

        const fetch = window.fetch;
        window.fetch = function(resource, options) {
            const response = fetch.call(this, resource, options);
            response.then(() => {
                if(resource.endsWith("/cart/add.js") || resource.endsWith("/cart/add")) {
                    updateCart();
                }
            });

            return response;
        }
    }

    connectedCallback() {
        this.setupItemCount();
        this.setupSlideDrawer();
    }

    setupItemCount() {
        const itemCount = Number(this.getAttribute("data-item-count") ?? 0);
        const itemCountSpan = document.createElement("span");
        itemCountSpan.id = 'cart-item-count';
        itemCountSpan.textContent = itemCount;

        this.textContent = "Cart Item Count: "
        this.appendChild(itemCountSpan)
    }  

    setupSlideDrawer() {
        let dawnCartDrawerButton = document.querySelector("#cart-icon-bubble");
        if(!dawnCartDrawerButton) return;

        dawnCartDrawerButton.addEventListener('click', (e) => {
            e.preventDefault();

            console.log('click!');
        })
    }

    async updateCart() {
        const response = await fetch("/cart.js");
        const cart = await response.json();

        const newItemCount = cart.item_count;

        const itemCountSpan = this.querySelector("#cart-item-count");
        itemCountSpan.textContent = newItemCount;
    } 
}

customElements.define("custom-cart-drawer", CustomCartDrawer);