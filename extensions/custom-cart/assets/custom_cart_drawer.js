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
            if(!url.endsWith("/cart/change.js") && !url.endsWith("/cart/change")) return;
            if(this.readyState !== XMLHttpRequest.DONE) return;
            
            document.dispatchEvent(new CustomCartUpdatedEvent());
        });
        open.call(this, method, url, async, user, password);
    };

    const fetch = window.fetch;
    window.fetch = function(resource, options) {
        const response = fetch.call(this, resource, options);
        response.then(() => {
            if(resource.endsWith("/cart/add.js") ||
                resource.endsWith("/cart/add") ||
                resource.endsWith("/cart/change.js") ||
                resource.endsWith("/cart/change")
            ) {
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
            const cartItem = new CustomCartItem();
            cartItem.setAttribute('data-title', item.title);
            cartItem.setAttribute('data-quantity', item.quantity);
            cartItem.setAttribute('data-image', item.image);
            cartItem.setAttribute('data-final-price', item.final_price);
            cartItem.setAttribute('data-final-line-price', item.final_line_price);
            cartItem.setAttribute('data-key', item.key);
            items.push(cartItem);
        }

        const itemList = this.querySelector(".cart-drawer__item-list");
        itemList.replaceChildren(...items);
    } 
}

class CustomCartItem extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('data-title');
        const quantity = this.getAttribute('data-quantity');
        const image = this.getAttribute('data-image');
        const finalPrice = this.getAttribute('data-final-price');
        const finalLinePrice = this.getAttribute('data-final-line-price');
        const key = this.getAttribute('data-key');

        this.className = 'cart-item';

        const body = document.createElement('p');
        body.className = 'cart-item__body';
        body.innerText = `${title} | qty: ${quantity} | ${finalLinePrice} | ${finalPrice}`;

        const img = document.createElement('img');
        img.src = image;

        const removeFromCartButton = document.createElement('button');
        removeFromCartButton.innerText = 'Remove from Cart';
        removeFromCartButton.addEventListener('click', async () => {
            fetch(window.Shopify.routes.root + 'cart/change.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: key,
                    quantity: 0
                })
            })
            
        });

        this.appendChild(body);
        this.appendChild(img);
        this.appendChild(removeFromCartButton);
    }
}

customElements.define("custom-cart-drawer", CustomCartDrawer);
customElements.define("custom-cart-item", CustomCartItem);