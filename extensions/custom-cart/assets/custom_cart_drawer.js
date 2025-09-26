class CustomCartUpdatedEvent extends Event {
    static EVENT_NAME = "custom_cart:updated";

    constructor() {
        super(CustomCartUpdatedEvent.EVENT_NAME);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        this.addEventListener("readystatechange", () => {
            if(!url.endsWith("/cart/add.js") && !url.endsWith("/cart/add")) return;
            if(this.readyState !== XMLHttpRequest.DONE) return;
            
            document.dispatchEvent(new CustomCartUpdatedEvent());
        });
        open.call(this, method, url, async, user, password);
    };

    const fetch = window.fetch;
    window.fetch = function(resource, options) {
        const response = fetch.call(this, resource, options);
        response.then(() => {
            if(resource.endsWith("/cart/add.js") || resource.endsWith("/cart/add")) {
                document.dispatchEvent(new CustomCartUpdatedEvent());
            }
        });

        return response;
    }
});

class CustomCartDrawer extends HTMLElement {
    constructor() {
        super();
        document.addEventListener(CustomCartUpdatedEvent.EVENT_NAME, this.updateCart.bind(this))
    }

    connectedCallback() {
        let vesselCartDrawerButton = document.querySelector(".action__cart");
        if(!vesselCartDrawerButton) return;

        vesselCartDrawerButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDrawer();
        })


        this.querySelector('.cart-drawer__close-button').addEventListener(('click'), () => {
            this.toggleDrawer();
        });
    }

    toggleDrawer() {
        const isClosed = this.className === '--closed' || this.className === "--initial-closed"; // NB: --initial-closed is used to prevent the css keyframe from playing on load. 
        this.className = isClosed ? '--opened' : '--closed';
    }

    async updateCart() {
        const response = await fetch("/cart.js");
        const cart = await response.json();

        const newItemCount = cart.item_count;
        const itemCountSpan = this.querySelector(".cart-drawer__item-count");
        itemCountSpan.textContent = newItemCount;

        const items = [];
        for(const item of cart.items) {
            const itemElement = document.createElement('p');
            itemElement.innerText = `${item.title} | qty: ${item.quantity}`;
            items.push(itemElement);
        }

        const itemList = this.querySelector(".cart-drawer__item-list");
        itemList.replaceChildren(...items);
    } 
}

class CustomCartItem extends HTMLElement {
    #item = undefined;
    constructor(cartItemBlob) {
        super();

        this.#item = cartItemBlob;
    }

    connectedCallback() {

    }
}

customElements.define("custom-cart-drawer", CustomCartDrawer);